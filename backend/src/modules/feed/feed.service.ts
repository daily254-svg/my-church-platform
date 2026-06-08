import { PrismaClient } from "@prisma/client";
import { CreatePostInput } from "./feed.validation";

const prisma = new PrismaClient();

export const createPost = async (
  data: CreatePostInput,
  userId: string,
  userRole: string
) => {
  if (data.type !== "TESTIMONY" && userRole === "MEMBER") {
    throw new Error("Only leadership can post this type");
  }

  const post = await prisma.feedPost.create({
    data: {
      type: data.type,
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl,
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  return post;
};

export const getAllPosts = async (userId: string) => {
  const posts = await prisma.feedPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, role: true },
      },
      likes: {
        where: { userId },
        select: { userId: true },
      },
    },
  });

  return posts.map((post) => ({
    ...post,
    isLiked: post.likes.length > 0,
    likes: undefined, // don't expose the raw likes array
  }));
};

export const likePost = async (postId: string, userId: string) => {
  const existingLike = await prisma.feedLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    // Unlike
    await prisma.feedLike.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    const updatedPost = await prisma.feedPost.update({
      where: { id: postId },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    });

    return { liked: false, likesCount: updatedPost.likesCount };
  } else {
    // Like
    await prisma.feedLike.create({
      data: {
        postId,
        userId,
      },
    });

    const updatedPost = await prisma.feedPost.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });

    return { liked: true, likesCount: updatedPost.likesCount };
  }
};

export const getPostLikeStatus = async (postId: string, userId: string) => {
  const like = await prisma.feedLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  return !!like;
};

export const addComment = async (
  postId: string,
  text: string,
  userId: string
) => {
  const comment = await prisma.feedComment.create({
    data: {
      text,
      postId,
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  await prisma.feedPost.update({
    where: { id: postId },
    data: {
      commentsCount: {
        increment: 1,
      },
    },
  });

  return comment;
};

export const getComments = async (postId: string) => {
  const comments = await prisma.feedComment.findMany({
    where: { postId },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return comments;
};

export const deletePost = async (
  postId: string,
  userId: string,
  userRole: string
) => {
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.userId !== userId && userRole !== "ADMIN") {
    throw new Error("Not authorized");
  }

  await prisma.feedPost.delete({
    where: { id: postId },
  });

  return post;
};