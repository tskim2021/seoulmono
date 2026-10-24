import { useSearch } from "wouter";
import List from "./List";

export default function Search() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const q = params.get("q") || "";

  return <List />;
}
