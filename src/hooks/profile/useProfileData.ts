import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchChildren } from '../../api/child';
import { fetchMyInfo, type UserInfo } from '../../api/user';
import { useChildrenStore } from '../../store/childrenStore';

const useProfileData = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { children, setChildren } = useChildrenStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchChildren()
      .then(setChildren)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [setChildren]);

  useFocusEffect(
    useCallback(() => {
      fetchMyInfo()
        .then(setUserInfo)
        .catch(() => {});
    }, [])
  );

  return { userInfo, children, isLoading };
};

export default useProfileData;
