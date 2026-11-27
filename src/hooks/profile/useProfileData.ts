import { useEffect } from 'react';
import { useSessionScope } from '../../query/hooks';
import { useChildrenQuery, useProfileQuery } from '../../query/resources';
import { prefetchChildSchoolData } from '../../query/schools';

const useProfileData = () => {
  const profile = useProfileQuery();
  const children = useChildrenQuery();
  const { version, language } = useSessionScope();
  useEffect(() => {
    if (children.data) void prefetchChildSchoolData({ version, language }, children.data);
  }, [children.data, version, language]);
  return {
    userInfo: profile.data ?? null,
    children: children.data ?? [],
    isLoading: profile.isLoading || children.isLoading,
  };
};
export default useProfileData;
