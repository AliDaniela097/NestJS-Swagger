import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { ProductoDto } from './producto.dto';
import type { Producto } from './productos.service';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiOkResponse({
    description: 'Lista de productos disponibles.',
    type: ProductoDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor.',
  })
  findAll(): Producto[] {
    return this.productosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Identificador numérico del producto',
  })
  @ApiOkResponse({
    description: 'Producto encontrado.',
    type: ProductoDto,
  })
  @ApiBadRequestResponse({
    description: 'El id enviado no es un número entero.',
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese id.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Producto {
    return this.productosService.findOne(id);
  }
}