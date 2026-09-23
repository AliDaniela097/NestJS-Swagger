import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductosService } from './productos.service';

describe('ProductosService', () => {
  let service: ProductosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductosService],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll devuelve el catálogo completo', () => {
    const productos = service.findAll();
    expect(productos).toHaveLength(3);
    expect(productos[0]).toEqual({
      id: 1,
      nombre: 'Teclado mecánico',
      precio: 45.9,
    });
  });

  it('findOne devuelve el producto cuando existe', () => {
    expect(service.findOne(2)).toEqual({
      id: 2,
      nombre: 'Mouse inalámbrico',
      precio: 19.5,
    });
  });

  it('findOne lanza NotFoundException si el id no existe', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });
});
