import type { Address } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { addressRepository } from "@/repositories";

export class AddressService {
  async createAddress(data: Partial<Address>) {
    return addressRepository.create(data);
  }

  async updateAddress(id: string, data: Partial<Address>) {
    return addressRepository.update(id, data);
  }

  async deleteAddress(id: string) {
    return addressRepository.delete(id);
  }

  async getAllAddresses(params?: IQueryParams<Address>) {
    return addressRepository.getAll(params);
  }

  async getAddressById(id: string, params?: IQueryParams<Address>) {
    return addressRepository.getById(id, params);
  }

  //   async getCoordinatesByPostalCode(countryCode: string, postalCode: string) {
//     const result = await this.model.findFirst({
//       where: {
//         countryCode: countryCode.toUpperCase(),
//         postalCode: postalCode.toUpperCase(),
//       },
//       select: {
//         latitude: true,
//         longitude: true,
//         countryCode: true,
//         postalCode: true,
//       },
//     });

//     return {
//       success: true,
//       data: result,
//     };
//   }

//   async searchPostalCodes(query: { countryCode?: string; postalCode?: string; limit?: number }) {
//     const where: any = {};

//     if (query.countryCode) {
//       where.countryCode = query.countryCode.toUpperCase();
//     }

//     if (query.postalCode) {
//       where.postalCode = {
//         contains: query.postalCode.toUpperCase(),
//       };
//     }

//     const results = await this.model.findMany({
//       where,
//       take: query.limit || 10,
//       select: {
//         countryCode: true,
//         postalCode: true,
//         latitude: true,
//         longitude: true,
//       },
//       orderBy: {
//         postalCode: "asc",
//       },
//     });

//     return {
//       success: true,
//       data: results,
//     };
//   }
}
