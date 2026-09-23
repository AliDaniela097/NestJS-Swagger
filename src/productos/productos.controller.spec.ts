import { Test, TestingModule } from '@nestjs/testing';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

describe('ProductosController', () => {
  let controller: ProductosController;
  let service: ProductosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductosController],
      providers: [ProductosService],
    }).compile();

    controller = module.get<ProductosController>(ProductosController);
    service = module.get<ProductosService>(ProductosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delega en el servicio', () => {
    const spy = jest.spyOn(service, 'findAll');
    controller.findAll();
    expect(spy).toHaveBeenCalled();
  });

  it('findOne delega en el servicio con el id recibido', () => {
    const spy = jest.spyOn(service, 'findOne');
    controller.findOne(1);
    expect(spy).toHaveBeenCalledWith(1);
  });
});
