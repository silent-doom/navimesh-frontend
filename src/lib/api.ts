import axios from "axios";

const baseURL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL,
  timeout: 60_000,
});

export const API_BASE_URL = baseURL;

export interface RouteStep {
  instruction: string;
  transit_mode: string;
}

export interface CommuterReroutePlan {
  disruption_identified: string;
  primary_route: RouteStep[];
  secondary_route: RouteStep[];
  executive_summary: string;
}

export interface CommuterRerouteResponse {
  status: string;
  city: string;
  destination: string;
  ai_reroute_plan: CommuterReroutePlan;
}

export interface SQLResponse {
  status: string;
  generated_sql: string;
  data: Record<string, unknown>[];
  executive_insight: string;
}

export interface RAGResponse {
  status: string;
  city_monitored: string;
  ai_response: string;
  retrieved_source_document: string;
  vector_confidence_score: number;
}

export async function postCommuterReroute(params: {
  city: string;
  destination: string;
  file: File;
}): Promise<CommuterRerouteResponse> {
  const form = new FormData();
  form.append("city", params.city);
  form.append("destination", params.destination);
  form.append("file", params.file);
  const { data } = await api.post<CommuterRerouteResponse>(
    "/api/v1/commuter/reroute",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function postTextToSQL(user_query: string): Promise<SQLResponse> {
  const { data } = await api.post<SQLResponse>("/api/v1/planner/text-to-sql", {
    user_query,
  });
  return data;
}

export async function postLiveRAG(city: string, user_query: string): Promise<RAGResponse> {
  const { data } = await api.post<RAGResponse>("/api/v1/planner/live-rag-chat", {
    city,
    user_query,
  });
  return data;
}
