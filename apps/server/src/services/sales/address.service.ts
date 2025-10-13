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
}