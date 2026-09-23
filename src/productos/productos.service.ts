import { Injectable, NotFoundException } from '@nestjs/common';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
}

@Injectable()
export class ProductosService {
  private readonly productos: Producto[] = [
    { id: 1, nombre: 'Teclado mecánico', precio: 45.90 },
    { id: 2, nombre: 'Mouse inalámbrico', precio: 19.50 },
    { id: 3, nombre: 'Monitor 24"', precio: 129.99 },
  ];
 /**
   * Devuelve el catálogo completo de productos disponibles.
   *
   * @returns Arreglo de productos. Puede estar vacío si no hay productos.
   */
  findAll(): Producto[] {
    return this.productos;
  }
 /**
   * Busca un producto por su identificador.
   *
   * @param id - Identificador numérico del producto.
   * @returns El producto encontrado.
   * @throws NotFoundException si no existe un producto con ese id.
   */
  findOne(id: number): Producto {
    const producto = this.productos.find((p) => p.id === id);
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
  }
}