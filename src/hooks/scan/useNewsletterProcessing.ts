import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  getNewsletterStatus,
  resumeNewsletter,
  retryAnalysis,
  skipNewsletterPage,
  uploadNewsletter,
  type NewsletterStatusResult,
} from '../../api/newsletter';
import { invalidateResources, queryClient, resourceKey } from '../../query/client';
import { useApiMutation, useServerQuery, useSessionScope } from '../../query/hooks';
import { isTransientQueryError } from '../../query/state';
import { isCurrentSession } from '../../utils/authSession';

const NEWSLETTER_RESOURCES = [
  'newsletters',
  'newsletter',
  'recent',
  'preview',
  'newsletterChecklist',
  'summary',
  'topics',
  'cultural',
  'translation',
];

type Action = 'retry' | 'skip';
type Command = 'refresh' | 'resume' | 'retry-analysis' | 'skip';
type ProcessingError =
  | { kind: 'start'; cause: unknown }
  | {
      kind: 'action';
      cause: unknown;
      command: Exclude<Command, 'refresh'>;
      pageNo?: number;
    };
type Lifecycle = {
  key: string;
  newsletterId: number | null;
  initialStatus?: NewsletterStatusResult;
  action: Action | null;
  error: ProcessingError | null;
};

export type ProcessingPhase =
  | 'idle'
  | 'starting'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'error';

interface ProcessingInput {
  photoUris: string[];
  childId?: number;
  resumeNewsletterId?: number;
}

const initialLifecycle = (key: string): Lifecycle => ({
  key,
  newsletterId: null,
  action: null,
  error: null,
});

type CommandSnapshot = {
  newsletterId: number | null;
  status: NewsletterStatusResult | undefined;
  statusError: boolean;
  error: unknown;
  processingError: ProcessingError | null;
};

const getCommand = (action: Action, snapshot: CommandSnapshot): Command | null => {
  if (snapshot.newsletterId === null) return null;
  const { status, statusError, error } = snapshot;
  if (statusError) {
    return action === 'retry' && isTransientQueryError(error) ? 'refresh' : null;
  }
  if (action === 'skip') {
    return status?.status === 'PAUSED' && status.skippable && status.pausedPageNo ? 'skip' : null;
  }
  if (status?.status === 'PAUSED' && status.retryable) return 'resume';
  if (status?.status === 'FAILED' && status.canRetry !== false) return 'retry-analysis';
  return null;
};

const getErrorRetryCommand = (snapshot: CommandSnapshot): Command | null => {
  const failure = snapshot.processingError;
  if (snapshot.statusError || failure?.kind !== 'action') return getCommand('retry', snapshot);
  if (!isTransientQueryError(failure.cause)) return null;
  const command = getCommand(failure.command === 'skip' ? 'skip' : 'retry', snapshot);
  if (command !== failure.command) return null;
  if (command === 'skip' && snapshot.status?.pausedPageNo !== failure.pageNo) return null;
  return command;
};

// Query owns server snapshots and bounded network retries; this hook owns screen lifetime
// and serializes commands. Writes may finish on the server after leaving the screen.
const useNewsletterProcessing = ({
  photoUris: inputPhotoUris,
  childId,
  resumeNewsletterId,
}: ProcessingInput) => {
  // Equal route values represent the same work even when the caller creates a new array.
  const photosKey = JSON.stringify(inputPhotoUris);
  const photoUris = useMemo<string[]>(() => JSON.parse(photosKey), [photosKey]);
  const scope = useSessionScope();
  const focused = useIsFocused();
  const upload = useApiMutation(uploadNewsletter, NEWSLETTER_RESOURCES);
  const resume = useApiMutation(resumeNewsletter, NEWSLETTER_RESOURCES);
  const retryAnalysisRequest = useApiMutation(retryAnalysis, NEWSLETTER_RESOURCES);
  const skip = useApiMutation(skipNewsletterPage, NEWSLETTER_RESOURCES);
  const key = JSON.stringify([scope.version, resumeNewsletterId, photoUris, childId]);
  const [lifecycle, setLifecycle] = useState<Lifecycle>(() => initialLifecycle(key));
  const commands = useRef(
    new Map<
      string,
      {
        newsletterId: number;
        action: Action;
        promise: Promise<void>;
      }
    >()
  );
  const current = lifecycle.key === key ? lifecycle : initialLifecycle(key);
  const context = useMemo(
    () => ({
      key,
      focused,
      authenticated: scope.authenticated,
      language: scope.language,
      active: false,
      request: null as object | null,
    }),
    // A new context also invalidates callbacks retained by native alerts across focus changes.
    [key, focused, scope.authenticated, scope.language]
  );
  const isCurrent = useCallback(
    () => context.active && isCurrentSession(scope.version),
    [context, scope.version]
  );
  useLayoutEffect(() => {
    context.active = focused && scope.authenticated;
    return () => {
      context.active = false;
      context.request = null;
    };
  }, [context, focused, scope.authenticated]);
  useFocusEffect(
    useCallback(() => {
      context.active = context.focused && context.authenticated;
      return () => {
        context.active = false;
      };
    }, [context])
  );

  const startTask = useRef<{
    key: string;
    promise: ReturnType<typeof uploadNewsletter>;
  } | null>(null);
  useEffect(() => {
    if (!isCurrent() || (!photoUris.length && resumeNewsletterId === undefined)) return undefined;
    let active = true;
    setLifecycle(initialLifecycle(key));
    // Reuse the same start across Strict Mode effect replay and focus restoration.
    if (startTask.current?.key !== key) {
      startTask.current = {
        key,
        promise:
          resumeNewsletterId === undefined
            ? upload(photoUris, childId)
            : resume(resumeNewsletterId),
      };
    }
    const task = startTask.current;
    void task.promise.then(
      (result) => {
        if (!active || !isCurrent()) return;
        setLifecycle({
          ...initialLifecycle(key),
          newsletterId: result.newsletterId,
          initialStatus: {
            status: result.status,
            progressPercent: result.status === 'COMPLETED' ? 100 : 0,
            progressMessage: '',
          },
          action: commands.current.get(key)?.action ?? null,
        });
      },
      (cause: unknown) => {
        if (active && isCurrent() && !axios.isCancel(cause)) {
          setLifecycle({ ...initialLifecycle(key), error: { kind: 'start', cause } });
        }
      }
    );
    return () => {
      active = false;
    };
  }, [
    key,
    context,
    isCurrent,
    photoUris,
    childId,
    resumeNewsletterId,
    upload,
    resume,
    scope.version,
    scope.language,
  ]);

  const { newsletterId, action } = current;
  const statusQuery = useServerQuery(
    'newsletterStatus',
    [newsletterId],
    (signal) => getNewsletterStatus(newsletterId!, signal),
    {
      enabled: focused && newsletterId !== null,
      staleTime: 0,
      refetchInterval: (query) =>
        query.state.error ||
        ['COMPLETED', 'FAILED', 'PAUSED'].includes(query.state.data?.status ?? '')
          ? false
          : 2000,
    }
  );
  const status = newsletterId === null ? undefined : (statusQuery.data ?? current.initialStatus);
  const hasStatusError =
    newsletterId !== null && statusQuery.isError && !axios.isCancel(statusQuery.error);
  const { refetch } = statusQuery;
  const snapshot: CommandSnapshot = {
    newsletterId,
    status,
    statusError: statusQuery.isError,
    error: statusQuery.error,
    processingError: current.error,
  };
  const canRetry = getCommand('retry', snapshot) !== null;
  const canSkip = getCommand('skip', snapshot) !== null;
  const canRetryError = getErrorRetryCommand(snapshot) !== null;
  const commandState = useRef<CommandSnapshot>(snapshot);
  useLayoutEffect(() => {
    commandState.current = {
      newsletterId,
      status,
      statusError: statusQuery.isError,
      error: statusQuery.error,
      processingError: current.error,
    };
  }, [newsletterId, status, statusQuery.isError, statusQuery.error, current.error]);

  useEffect(() => {
    const pending = commands.current.get(key);
    if (!pending || !isCurrent()) return undefined;
    let active = true;
    const request = {};
    context.request = request;
    // Returning to a screen observes its pending write instead of issuing a competing command.
    const reconcile = async () => {
      if (!active || !isCurrent()) return;
      await queryClient.invalidateQueries({
        queryKey: resourceKey(
          scope.version,
          scope.language,
          'newsletterStatus',
          pending.newsletterId
        ),
        exact: true,
      });
      if (active && isCurrent() && context.request === request) {
        context.request = null;
        setLifecycle((prev) => ({ ...prev, action: null }));
      }
    };
    void pending.promise.then(reconcile, reconcile);
    return () => {
      active = false;
    };
  }, [key, context, isCurrent, scope.version, scope.language]);

  const runAction = useCallback(
    async (intent: Action | 'retry-error') => {
      if (!isCurrent() || context.request || commands.current.has(key)) return;
      const latest = commandState.current;
      const command =
        intent === 'retry-error' ? getErrorRetryCommand(latest) : getCommand(intent, latest);
      const id = latest.newsletterId;
      if (!command || id === null) return;
      const nextAction = command === 'skip' ? 'skip' : 'retry';
      const retryStatus = command === 'refresh';
      const request = {};
      context.request = request;
      setLifecycle((prev) => ({ ...prev, action: nextAction, error: null }));
      let release: (() => void) | undefined;
      const settled = new Promise<void>((resolve) => {
        release = resolve;
      });
      commands.current.set(key, { newsletterId: id, action: nextAction, promise: settled });
      let commandFinished = retryStatus;
      try {
        if (retryStatus) await refetch({ throwOnError: true });
        else if (command === 'skip') await skip(id, latest.status!.pausedPageNo!);
        else if (command === 'retry-analysis') await retryAnalysisRequest(id);
        else await resume(id);
        if (!retryStatus) {
          commandFinished = true;
          if (!isCurrent()) return;
          // A pre-command status request must not be reused as the post-command snapshot.
          await queryClient.cancelQueries({
            queryKey: resourceKey(scope.version, scope.language, 'newsletterStatus', id),
            exact: true,
          });
        }
        if (!isCurrent()) return;
        if (!retryStatus) await refetch({ throwOnError: true });
      } catch (cause) {
        // Failed reads belong to statusQuery so the retry remains a GET, never another write.
        if (!commandFinished && command !== 'refresh' && isCurrent() && !axios.isCancel(cause)) {
          setLifecycle((prev) => ({
            ...prev,
            error: {
              kind: 'action',
              cause,
              command,
              pageNo: command === 'skip' ? latest.status?.pausedPageNo : undefined,
            },
          }));
        }
      } finally {
        commands.current.delete(key);
        release?.();
        if (isCurrent() && context.request === request) {
          context.request = null;
          setLifecycle((prev) => ({ ...prev, action: null }));
        }
      }
    },
    [
      key,
      context,
      isCurrent,
      skip,
      retryAnalysisRequest,
      resume,
      refetch,
      scope.version,
      scope.language,
    ]
  );
  const retry = useCallback(() => runAction('retry'), [runAction]);
  const retryError = useCallback(() => runAction('retry-error'), [runAction]);
  const skipPage = useCallback(() => runAction('skip'), [runAction]);

  const error = useMemo(() => {
    if (!focused || !scope.authenticated || action) return null;
    // A stale snapshot or an earlier write error must not hide the latest read failure.
    if (hasStatusError) {
      return {
        kind: 'status' as const,
        cause: statusQuery.error,
        retryable: canRetry,
        at: statusQuery.errorUpdatedAt,
      };
    }
    if (status?.status === 'COMPLETED') return null;
    if (current.error)
      return {
        ...current.error,
        retryable: current.error.kind === 'action' && canRetryError,
      };
    if (newsletterId === null) return null;
    if (status?.status === 'FAILED') {
      return { kind: 'analysis' as const, cause: null, retryable: canRetry };
    }
    return null;
  }, [
    focused,
    scope.authenticated,
    action,
    current.error,
    newsletterId,
    hasStatusError,
    statusQuery.error,
    statusQuery.errorUpdatedAt,
    status,
    canRetry,
    canRetryError,
  ]);

  let phase: ProcessingPhase = 'starting';
  if (!focused || !scope.authenticated || (!photoUris.length && resumeNewsletterId === undefined)) {
    phase = 'idle';
  } else if (current.error?.kind === 'start' || hasStatusError) {
    phase = 'error';
  } else if (status?.status === 'COMPLETED') phase = 'completed';
  else if (status?.status === 'PAUSED') phase = 'paused';
  else if (status?.status === 'FAILED') phase = 'failed';
  else if (newsletterId !== null) phase = 'processing';

  useEffect(() => {
    if (phase === 'completed' && isCurrent()) {
      void invalidateResources(NEWSLETTER_RESOURCES, scope.version);
    }
  }, [phase, newsletterId, isCurrent, scope.version]);

  return {
    key,
    phase,
    newsletterId,
    status,
    action,
    error,
    canRetry,
    canSkip,
    retry,
    retryError,
    skipPage,
    isCurrent,
  };
};

export default useNewsletterProcessing;
