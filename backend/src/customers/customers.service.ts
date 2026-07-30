import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: customers.map((c) => this.mapCustomer(c)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return this.mapCustomer(customer);
  }

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        companyName: dto.companyName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        ntn: dto.ntn,
        cnic: dto.cnic,
        projectName: dto.projectName,
        notes: dto.notes,
      },
    });

    return this.mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findById(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.ntn !== undefined && { ntn: dto.ntn }),
        ...(dto.cnic !== undefined && { cnic: dto.cnic }),
        ...(dto.projectName !== undefined && { projectName: dto.projectName }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapCustomer(customer);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Customer deleted successfully' };
  }

  private mapCustomer(customer: {
    id: string;
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ntn: string | null;
    cnic: string | null;
    projectName: string | null;
    totalBilled: any;
    totalPaid: any;
    isActive: boolean;
    notes: string | null;
    createdAt: Date;
  }) {
    const totalBilled = Number(customer.totalBilled);
    const totalPaid = Number(customer.totalPaid);

    return {
      id: customer.id,
      name: customer.name,
      companyName: customer.companyName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      ntn: customer.ntn,
      cnic: customer.cnic,
      projectName: customer.projectName,
      totalBilled,
      totalPaid,
      outstandingBalance: totalBilled - totalPaid,
      isActive: customer.isActive,
      notes: customer.notes,
      createdAt: customer.createdAt,
    };
  }
}
