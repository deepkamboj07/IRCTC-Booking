import { adminTrainsRepository } from "./admin-trains.repository";
import { getPaginationMeta } from "../../utils/pagination.utils";
import { NotFoundError, ConflictError, ValidationError } from "../../errors/app.errors";
import {
  CreateTrainDto,
  UpdateTrainDto,
  SetRouteStopsDto,
  CreateCoachDto,
  CreateScheduleDto,
  TrainListQuery,
} from "./admin-trains.schemas";

export const adminTrainsService = {
  async list(query: TrainListQuery) {
    const [trains, total] = await adminTrainsRepository.findAll(query);
    return { data: trains, meta: getPaginationMeta(total, query) };
  },

  async getById(id: string) {
    const train = await adminTrainsRepository.findById(id);
    if (!train) throw new NotFoundError("Train");
    return train;
  },

  async create(dto: CreateTrainDto) {
    const existing = await adminTrainsRepository.findByTrainNumber(dto.trainNumber);
    if (existing) throw new ConflictError(`Train number ${dto.trainNumber} already exists`);
    return adminTrainsRepository.create(dto);
  },

  async update(id: string, dto: UpdateTrainDto) {
    const train = await adminTrainsRepository.findById(id);
    if (!train) throw new NotFoundError("Train");

    if (dto.trainNumber && dto.trainNumber !== train.trainNumber) {
      const existing = await adminTrainsRepository.findByTrainNumber(dto.trainNumber);
      if (existing) throw new ConflictError(`Train number ${dto.trainNumber} already exists`);
    }

    return adminTrainsRepository.update(id, dto);
  },

  async delete(id: string) {
    const train = await adminTrainsRepository.findById(id);
    if (!train) throw new NotFoundError("Train");
    await adminTrainsRepository.delete(id);
  },

  async setRouteStops(trainId: string, dto: SetRouteStopsDto) {
    const train = await adminTrainsRepository.findById(trainId);
    if (!train) throw new NotFoundError("Train");

    // Validate sequences are unique
    const sequences = dto.stops.map(s => s.sequence);
    if (new Set(sequences).size !== sequences.length) {
      throw new ValidationError("Route stop sequences must be unique");
    }

    // Validate station IDs are unique (a train can't stop at same station twice)
    const stationIds = dto.stops.map(s => s.stationId);
    if (new Set(stationIds).size !== stationIds.length) {
      throw new ValidationError("A train cannot stop at the same station twice");
    }

    await adminTrainsRepository.setRouteStops(trainId, dto.stops);
    return adminTrainsRepository.getRouteStops(trainId);
  },

  getRouteStops(trainId: string) {
    return adminTrainsRepository.getRouteStops(trainId);
  },

  async addCoach(trainId: string, dto: CreateCoachDto) {
    const train = await adminTrainsRepository.findById(trainId);
    if (!train) throw new NotFoundError("Train");

    // Check coach number is unique on this train
    const duplicate = train.coaches.find(c => c.coachNumber === dto.coachNumber);
    if (duplicate) throw new ConflictError(`Coach ${dto.coachNumber} already exists on this train`);

    return adminTrainsRepository.createCoachWithSeats(trainId, dto);
  },

  async getCoaches(trainId: string) {
    const train = await adminTrainsRepository.findById(trainId);
    if (!train) throw new NotFoundError("Train");
    return adminTrainsRepository.getCoaches(trainId);
  },

  async deleteCoach(trainId: string, coachId: string) {
    const coach = await adminTrainsRepository.findCoach(coachId);
    if (!coach || coach.trainId !== trainId) throw new NotFoundError("Coach");
    await adminTrainsRepository.deleteCoach(coachId);
  },

  async createSchedule(trainId: string, dto: CreateScheduleDto) {
    const train = await adminTrainsRepository.findTrainWithStopsAndCoaches(trainId);
    if (!train) throw new NotFoundError("Train");

    if (train.routeStops.length < 2) {
      throw new ValidationError("Train must have at least 2 route stops before scheduling");
    }
    if (train.coaches.length === 0) {
      throw new ValidationError("Train must have at least one coach before scheduling");
    }

    const journeyDate = new Date(dto.journeyDate);

    return adminTrainsRepository.createScheduleWithAvailability(
      trainId,
      journeyDate,
      train.coaches.map(c => ({ id: c.id, totalSeats: c.totalSeats })),
      train.routeStops.map(s => ({ stationId: s.stationId, sequence: s.sequence }))
    );
  },

  async getSchedules(trainId: string) {
    const train = await adminTrainsRepository.findById(trainId);
    if (!train) throw new NotFoundError("Train");
    return adminTrainsRepository.getSchedules(trainId);
  },
};
