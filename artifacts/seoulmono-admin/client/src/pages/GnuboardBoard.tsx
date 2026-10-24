import { useSearch, Link } from "wouter";
import InfoBoardDetail from "./InfoBoardDetail";
import InfoBoardList from "./InfoBoardList";
import PostDetail from "./PostDetail";
import BoardList from "./BoardList";

export default function GnuboardBoard() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const boTable = params.get("bo_table") ?? "";
  const wrId = params.get("wr_id");

  if (boTable === "info") {
    if (wrId) {
      const postId = parseInt(wrId) - 25;
      return <InfoBoardDetail postIdProp={postId} />;
    }
    return <InfoBoardList />;
  }

  if (boTable === "notice") {
    if (wrId) {
      const postId = parseInt(wrId);
      return <PostDetail postIdProp={postId} />;
    }
    return <BoardList slugProp="notice" />;
  }

  return null;
}
