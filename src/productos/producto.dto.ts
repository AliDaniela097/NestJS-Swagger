import { ApiProperty } from '@nestjs/swagger';
import type { Producto } from './productos.service';

export class ProductoDto implements Producto {
  @ApiProperty({ example: 1, description: 'Identificador único del producto' })
  id: number;

  @ApiProperty({ example: 'Teclado mecánico', description: 'Nombre del producto' })
  nombre: string;

  @ApiProperty({ example: 45.9, description: 'Precio en USD' })
  precio: number;
}