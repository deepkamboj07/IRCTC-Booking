import { prisma } from "../config/prisma";
import { getPaginationSkip } from "../utils/pagination.utils";

export const stationsRepository = {
  create(data: { code: string; name: string; city: string; state: string }) {
    return prisma.station.create({ data });
  },

  findAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const where = search
      ? {
          OR: [
            { name:  { contains: search, mode: "insensitive" as const } },
            { code:  { contains: search, mode: "insensitive" as const } },
            { city:  { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return Promise.all([
      prisma.station.findMany({
        where,
        skip:    getPaginationSkip({ page, limit }),
        take:    limit,
        orderBy: { code: "asc" },
      }),
      prisma.station.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.station.findUnique({ where: { id } });
  },

  findByCode(code: string) {
    return prisma.station.findUnique({ where: { code } });
  },

  update(id: string, data: { code?: string; name?: string; city?: string; state?: string }) {
    return prisma.station.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.station.delete({ where: { id } });
  },
};
