import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Finova`;
  }, [title]);
}

export default usePageTitle;
