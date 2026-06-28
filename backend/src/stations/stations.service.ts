import { stationsRepository } from "./stations.repository";
import { getPaginationMeta } from "../utils/pagination.utils";
import { ConflictError, NotFoundError } from "../errors/app.errors";
import { CreateStationDto, UpdateStationDto, StationListQuery } from "./stations.schemas";

export const stationsService = {
  async list(query: StationListQuery) {
    const [stations, total] = await stationsRepository.findAll(query);
    return { data: stations, meta: getPaginationMeta(total, query) };
  },

  async getById(id: string) {
    const station = await stationsRepository.findById(id);
    if (!station) throw new NotFoundError("Station");
    return station;
  },

  async create(dto: CreateStationDto) {
    const existing = await stationsRepository.findByCode(dto.code);
    if (existing) throw new ConflictError(`Station code ${dto.code} already exists`);
    return stationsRepository.create(dto);
  },

  async update(id: string, dto: UpdateStationDto) {
    const station = await stationsRepository.findById(id);
    if (!station) throw new NotFoundError("Station");

    if (dto.code && dto.code !== station.code) {
      const existing = await stationsRepository.findByCode(dto.code);
      if (existing) throw new ConflictError(`Station code ${dto.code} already exists`);
    }

    return stationsRepository.update(id, dto);
  },

  async delete(id: string) {
    const station = await stationsRepository.findById(id);
    if (!station) throw new NotFoundError("Station");
    await stationsRepository.delete(id);
  },
};
