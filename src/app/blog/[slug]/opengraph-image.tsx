import { ImageResponse } from "next/og";

import { getPost } from "@/content/blog/posts";
import { siteUrl } from "@/lib/site";

export const alt = "Abdelrhman Samy — writing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  const host = new URL(siteUrl()).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#0b0b0a",
          color: "#f5f1e8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 4,
            color: "#c6f035",
          }}
        >
          <span>WRITING</span>
          <span>ABDELRHMAN SAMY</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              maxWidth: 1040,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {post.title}
          </div>
          <div
            style={{
              maxWidth: 1000,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#b7b0a4",
            }}
          >
            {post.excerpt}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#b7b0a4",
          }}
        >
          <span>Frontend engineering · Interface design · Motion</span>
          <span>{host}</span>
        </div>
      </div>
    ),
    size,
  );
}
