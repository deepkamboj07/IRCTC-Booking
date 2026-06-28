import { stationsService } from "../../stations/stations.service";

export interface SearchStationsInput {
  search: string;
  limit?: number;
}

export async function searchStations(input: SearchStationsInput) {
  const result = await stationsService.list({
    search: input.search,
    limit: input.limit ?? 8,
    page: 1,
  });
  return { stations: result.data };
}
