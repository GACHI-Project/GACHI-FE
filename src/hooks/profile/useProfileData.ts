import { useChildrenQuery, useProfileQuery } from '../../query/resources';

const useProfileData = () => {
  const profile = useProfileQuery();
  const children = useChildrenQuery();
  return {
    userInfo: profile.data ?? null,
    children: children.data ?? [],
    isLoading: profile.isLoading || children.isLoading,
  };
};
export default useProfileData;
