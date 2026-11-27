import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../../query/client';
import { useSessionScope } from '../../query/hooks';
import {
  cacheSchoolDetails,
  canFetchSchoolDetails,
  schoolDetailsOptions,
} from '../../query/schools';
import type { SchoolResult } from '../../types/school';

const useSchoolAddress = (school: SchoolResult | null, visible: boolean) => {
  const scope = useSessionScope();
  const { version, language } = scope;
  const needsAddress = !school?.roadAddress.trim();
  useEffect(() => {
    cacheSchoolDetails({ version, language }, school);
  }, [school, version, language]);
  const { data } = useQuery(
    {
      ...schoolDetailsOptions(scope, school),
      enabled: visible && needsAddress && canFetchSchoolDetails(school),
    },
    queryClient
  );
  if (
    !school ||
    !needsAddress ||
    !data ||
    data.schoolCode !== school.schoolCode ||
    data.officeCode !== school.officeCode
  )
    return school;

  return {
    ...school,
    roadAddress: data.roadAddress || school.roadAddress,
    locationName: data.locationName || school.locationName,
  };
};

export default useSchoolAddress;
