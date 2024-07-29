import { queryClient } from "@/libs/api/react-query";
import {
  Blog,
  BlogComment,
  BlogsByAuthorResponse,
  BlogsCommentsByBlogIdResponse,
  BookmarkBlog,
  BookmarkBlogResponse,
  SingleBlog,
  SingleBlogComment,
} from "@/types/blog-response";
import { InfiniteData } from "@tanstack/react-query";

export const getAuthorUnPublishedBlogQueryKey = (authorId: string) => {
  return ["get-blogs-by-author", authorId, false];
};
export const getAuthorPublishedBlogQueryKey = (authorId: string) => {
  return ["get-blogs-by-author", authorId, true];
};
export const getCommentByBlogIdQueryKey = (blodId: string) => {
  return ["get-blog-comments-by-blog-id", blodId];
};

export const getAllKeys = (authorId: string) => {
  return [
    getAuthorUnPublishedBlogQueryKey(authorId),
    getAuthorPublishedBlogQueryKey(authorId),
  ];
};

export const getBookmarkKeyByUserId = (userId: string) => {
  return ["get-bookmarked-blogs", userId];
};

export const createBlogCacheUpdate = (data: Blog) => {
  const authorUnPublishKey = getAuthorUnPublishedBlogQueryKey(data.user.id);
  const keys = [authorUnPublishKey];

  keys.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);
    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          if (oldData.pages[0]?.data) {
            oldData.pages[0].data = [data, ...oldData.pages[0].data];
          }
          return {
            ...oldData,
            pages: oldData.pages,
          };
        }
      );
    }
  });
};

const updateFnForSavingBlog = (
  data: Blog,
  pages: BlogsByAuthorResponse[]
): BlogsByAuthorResponse[] => {
  return pages.reduce((prev, page) => {
    page.data.forEach((item, index) => {
      if (item.id === data.id) {
        page.data[index] = data;
      }
    });

    return [...prev, page];
  }, [] as BlogsByAuthorResponse[]);
};

export const updateBlogQueryCacheUpdate = (data: Blog) => {
  const keys = getAllKeys(data.user.id);

  keys.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);

    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForSavingBlog(data, oldData.pages),
          };
        }
      );
    }
  });
};

const updateFnForRemovingBlog = (
  data: Blog | SingleBlog,
  pages: BlogsByAuthorResponse[]
): BlogsByAuthorResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.filter((item) => {
      const condition = item.id !== data.id;
      return condition;
    });

    return [...prev, page];
  }, [] as BlogsByAuthorResponse[]);
};

export const publishBlogQueryCacheUpdate = (data: Blog) => {
  const authorUnPublishKey = getAuthorUnPublishedBlogQueryKey(data.user.id);
  const authorPublishKey = getAuthorPublishedBlogQueryKey(data.user.id);

  // First when publish, we need to remove from unpublish list
  const exisitingUnpublishCache = queryClient.getQueryData(authorUnPublishKey);
  if (exisitingUnpublishCache) {
    queryClient.setQueryData(
      authorUnPublishKey,
      (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
        return {
          ...oldData,
          pages: updateFnForRemovingBlog(data, oldData.pages),
        };
      }
    );
  }

  // Adding Blog to Published List
  const exisitingPublishCache = queryClient.getQueryData(authorPublishKey);
  if (exisitingPublishCache) {
    queryClient.setQueryData(
      authorPublishKey,
      (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
        if (oldData.pages[0]?.data) {
          oldData.pages[0].data = [data, ...oldData.pages[0].data];
        }
        return {
          ...oldData,
          pages: oldData.pages,
        };
      }
    );
  }
};

export const deleteBlogQueryCacheUpdate = (data: SingleBlog) => {
  const keys = getAllKeys(data.userId);

  keys.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);

    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForRemovingBlog(data, oldData.pages),
          };
        }
      );
    }
  });
};

type favBlogCacheProps = {
  blogId: string;
  userId: string;
  count: number;
  isFavorite: boolean;
};

const updateFnForFavoriteBlog = (
  data: favBlogCacheProps,
  pages: BlogsByAuthorResponse[]
): BlogsByAuthorResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.map((item) => {
      const condition = item.id === data.blogId;

      if (condition && item.reactions) {
        item.reactions = { ...item.reactions, heart: data.count };
      }

      if (condition && item.userBlogReaction) {
        item.userBlogReaction = data.isFavorite
          ? item.userBlogReaction.reduce(
              (prev, next) => [...prev, next],
              [
                {
                  reaction: "HEART",
                  userId: data.userId,
                  blogId: data.blogId,
                },
              ]
            )
          : item.userBlogReaction.filter((item) => item.reaction !== "HEART");
      }

      return item;
    });

    return [...prev, page];
  }, [] as BlogsByAuthorResponse[]);
};

export const updateFavoriteBlogQueryCacheUpdate = (
  cacheProp: favBlogCacheProps
) => {
  const keys = getAllKeys(cacheProp.userId);

  keys.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);
    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForFavoriteBlog(cacheProp, oldData.pages),
          };
        }
      );
    }
  });
};

const updateFnForBlogCommentCount = (
  data: { blogId: string; type: "DECREMENT" | "INCREMENT" },
  pages: BlogsByAuthorResponse[]
): BlogsByAuthorResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.map((item) => {
      const condition = item.id === data.blogId;

      if (condition && data.type === "INCREMENT") {
        if (item?._count?.blogComments) {
          item._count.blogComments += 1;
        } else {
          item._count = { blogComments: 1 };
        }
      }

      if (condition && data.type === "DECREMENT") {
        if (item?._count?.blogComments && item?._count?.blogComments >= 0) {
          item._count.blogComments -= 1;
        } else {
          item._count = { blogComments: 0 };
        }
      }

      return item;
    });

    return [...prev, page];
  }, [] as BlogsByAuthorResponse[]);
};

const updateFnForUpdateComment = (
  data: BlogComment,
  pages: BlogsCommentsByBlogIdResponse[]
): BlogsCommentsByBlogIdResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.map((item) => {
      const condition = item.id === data.id;
      if (condition) {
        item.content = data.content;
      }
      return item;
    });

    return [...prev, page];
  }, [] as BlogsCommentsByBlogIdResponse[]);
};

export const addNewCommentQueryCacheUpdate = (blogComment: BlogComment) => {
  const cacheCommentKey = getCommentByBlogIdQueryKey(blogComment.blogId);
  const exisitingCacheComment = queryClient.getQueryData(cacheCommentKey);

  if (exisitingCacheComment) {
    queryClient.setQueryData(
      cacheCommentKey,
      (oldData: InfiniteData<BlogsCommentsByBlogIdResponse, unknown>) => {
        if (oldData.pages[0]?.data) {
          oldData.pages[0].data = [blogComment, ...oldData.pages[0].data];
        }
        return {
          ...oldData,
          pages: oldData.pages,
        };
      }
    );
  }

  const keysForBlog = [getAuthorPublishedBlogQueryKey(blogComment.userId)];
  keysForBlog.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);

    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForBlogCommentCount(
              {
                blogId: blogComment.blogId,
                type: "INCREMENT",
              },
              oldData.pages
            ),
          };
        }
      );
    }
  });
};

export const updateNewCommentQueryCacheUpdate = (blogComment: BlogComment) => {
  const cacheCommentKey = getCommentByBlogIdQueryKey(blogComment.blogId);
  const exisitingCacheComment = queryClient.getQueryData(cacheCommentKey);

  if (exisitingCacheComment) {
    queryClient.setQueryData(
      cacheCommentKey,
      (oldData: InfiniteData<BlogsCommentsByBlogIdResponse, unknown>) => {
        return {
          ...oldData,
          pages: updateFnForUpdateComment(blogComment, oldData.pages),
        };
      }
    );
  }
};

const updateFnForRemovingComment = (
  data: BlogComment | SingleBlogComment,
  pages: BlogsCommentsByBlogIdResponse[]
): BlogsCommentsByBlogIdResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.filter((item) => {
      const condition = item.id !== data.id;
      return condition;
    });

    return [...prev, page];
  }, [] as BlogsCommentsByBlogIdResponse[]);
};

export const deleteCommentQueryCacheUpdate = (
  blogComment: BlogComment | SingleBlogComment
) => {
  const cacheCommentKey = getCommentByBlogIdQueryKey(blogComment.blogId);
  const exisitingCacheComment = queryClient.getQueryData(cacheCommentKey);

  if (exisitingCacheComment) {
    queryClient.setQueryData(
      cacheCommentKey,
      (oldData: InfiniteData<BlogsCommentsByBlogIdResponse, unknown>) => {
        return {
          ...oldData,
          pages: updateFnForRemovingComment(blogComment, oldData.pages),
        };
      }
    );
  }

  const keysForBlog = [getAuthorPublishedBlogQueryKey(blogComment.userId)];
  keysForBlog.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);

    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForBlogCommentCount(
              {
                blogId: blogComment.blogId,
                type: "DECREMENT",
              },
              oldData.pages
            ),
          };
        }
      );
    }
  });
};

type BookmarkCache = {
  blogId: string;
  userId: string;
  isBookmark: boolean;
  blog: BookmarkBlog | null;
};

const updateFnForBookmarkBlogList = (
  data: BookmarkCache,
  pages: BlogsByAuthorResponse[]
): BlogsByAuthorResponse[] => {
  return pages.reduce((prev, page) => {
    page.data = page.data.map((item) => {
      const condition = item.id === data.blogId;
      if (condition && item?._count) {
        item._count.blogBookmarks = data.isBookmark ? 1 : 0;
      }
      return item;
    });

    return [...prev, page];
  }, [] as BlogsByAuthorResponse[]);
};

const updateFnForBookmarkList = (
  data: BookmarkCache,
  pages: BookmarkBlogResponse[]
): BookmarkBlogResponse[] => {
  const bookmarkBlog = data.blog;

  if (data.isBookmark && bookmarkBlog) {
    if (pages?.[0]?.data) {
      if (bookmarkBlog.blog._count) {
        bookmarkBlog.blog._count.blogBookmarks = 1;
      }
      pages[0].data = [bookmarkBlog, ...pages[0].data];
    }
    return pages;
  }

  return pages.reduce((prev, page) => {
    page.data = page.data.filter((item) => {
      return item.blog.id !== data.blogId;
    });

    return [...prev, page];
  }, [] as BookmarkBlogResponse[]);
};

export const updateBookmarkBlogQueryCacheUpdate = (
  cacheProp: BookmarkCache
) => {
  const queryBlogListKeys = getAllKeys(cacheProp.userId);

  queryBlogListKeys.forEach((key) => {
    const exisitingCache = queryClient.getQueryData(key);
    if (exisitingCache) {
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<BlogsByAuthorResponse, unknown>) => {
          return {
            ...oldData,
            pages: updateFnForBookmarkBlogList(cacheProp, oldData.pages),
          };
        }
      );
    }
  });

  const queryBookmarksKey = getBookmarkKeyByUserId(cacheProp.userId);
  const exisitingCache = queryClient.getQueryData(queryBookmarksKey);

  if (exisitingCache) {
    queryClient.setQueryData(
      queryBookmarksKey,
      (oldData: InfiniteData<BookmarkBlogResponse, unknown>) => {
        console.log(oldData);
        return {
          ...oldData,
          pages: updateFnForBookmarkList(cacheProp, oldData.pages),
        };
      }
    );
  }
};
