/**
 * Custom hooks for Page management using react-query.
 */
import { PagesService } from "@/client";
import { useQuery } from "@tanstack/react-query";

export const usePages = (projectId: string) => {
  return useQuery({
    queryKey: ["pages", projectId],
    queryFn: () => PagesService.getProjectPagesApiProjectsProjectIdPagesGet(projectId),
    enabled: !!projectId,
  });
};

export const usePageDetail = (pageId: string) => {
  return useQuery({
    queryKey: ["pages", pageId],
    queryFn: () => PagesService.getPageApiPagesPageIdGet(pageId),
    enabled: !!pageId,
  });
};

export const usePageData = (pageId: string) => {
  return useQuery({
    queryKey: ["page-data", pageId],
    queryFn: () => PagesService.getPageDataApiPagesPageIdDataGet(pageId),
    enabled: !!pageId,
  });
};
