# Auditoría no destructiva — API NestJS + Swagger (`nestjs-productos-api`)

**Fecha:** 2026-09-22
**Alcance:** `src/`, `main.ts`, `contrato.md`, configuración de proyecto (`package.json`, `tsconfig*.json`, `.gitignore`, `.oxlintrc.json`) y estado de Git.
**Método:** Revisión estática de código + ejecución de `npm run build`, `npm run lint` y `npm test` (no se modificó ningún archivo del repositorio).

---

## 1. Resumen ejecutivo

La implementación cubre correctamente el **núcleo funcional y de arquitectura** del laboratorio:

- Separación de responsabilidades Módulo → Controlador → Servicio correcta y sin fugas de responsabilidad.
- `main.ts` inicializa Swagger de forma válida: prefijo global `api/v1`, documentación en `/api/docs`, `@ApiTags` en el controlador.
- `ParseIntPipe` y `NotFoundException` se usan explícitamente tal como exige la guía, en vez de errores genéricos.
- El contrato (`contrato.md`) coincide en gran medida con el comportamiento real de los endpoints (rutas, verbos, códigos 200/400/404).
- `npm run build`, `npm run lint` y `npm test` se ejecutaron sin errores (3/3 suites, 3/3 tests, lint limpio).

Sin embargo, se identificaron **1 hallazgo crítico, 2 altos, 3 medios y 4 bajos**. El más relevante es que **el repositorio no tiene ningún commit** ("no commits yet"), lo cual incumple el requisito de versionamiento del laboratorio pese a que el código en el árbol de trabajo es funcional. También hay una brecha entre el contrato (que documenta respuesta 500 en ambos endpoints) y lo realmente expuesto en Swagger, una dependencia sin usar, y cobertura de pruebas insuficiente (solo `toBeDefined`).

**Veredicto general:** la base funcional es sólida y compilable, pero el laboratorio **no puede considerarse entregado/cerrado** hasta resolver el hallazgo crítico de versionamiento, y se recomienda corregir los hallazgos altos antes de dar por completos los pasos 4 y 8 del reto.

---

## 2. Hallazgos

| ID | Severidad | Título |
|----|-----------|--------|
| C-1 | 🔴 Crítico | El repositorio no tiene ningún commit registrado |
| A-1 | 🟠 Alto | Dependencia no utilizada `@nestjs/observe` en `dependencies` |
| A-2 | 🟠 Alto | Falta documentar la respuesta `500` exigida por el contrato en ambos endpoints |
| M-1 | 🟡 Medio | Duplicación no sincronizada entre `Producto` (interface) y `ProductoDto` (class) |
| M-2 | 🟡 Medio | Cobertura de pruebas insuficiente (solo `toBeDefined`, sin casos de negocio) |
| M-3 | 🟡 Medio | Falta `@ApiParam` explícito para `id` en `GET /productos/:id` |
| B-1 | 🟢 Bajo | Regla `typescript/no-explicit-any` deshabilitada en oxlint |
| B-2 | 🟢 Bajo | `strictPropertyInitialization: false` relaja el modo `strict` de TypeScript |
| B-3 | 🟢 Bajo | `AppController` (boilerplate) queda expuesto en Swagger sin `@ApiTags`/`@ApiOperation` |
| B-4 | 🟢 Bajo | No hay `ValidationPipe` global ni `class-validator` previstos para futuros endpoints con body |

---

## 3. Evidencia concreta

### C-1 — Sin commits en Git
```
$ git status
On branch master
No commits yet
Untracked files:
  .gitignore, .oxlintrc.json, .prettierrc, README.md, contrato.md,
  jest.config.ts, nest-cli.json, package-lock.json, package.json,
  src/, test/, tsconfig.build.json, tsconfig.json

$ git log --oneline -20
fatal: your current branch 'master' does not have any commits yet
```
Todo el árbol de trabajo, incluido `src/`, está en estado *untracked*. No existe historial de commits que respalde el avance del laboratorio.

### A-1 — Dependencia no utilizada
`package.json:26`
```json
"@nestjs/observe": "^0.3.0",
```
Búsqueda en el código fuente (`grep -rn "observe" src/`) no arroja ninguna coincidencia: no se importa, no se registra en `app.module.ts` (el `README.md:88` incluso indica que debería configurarse vía `ObserveModule.forRoot()`, pero eso nunca ocurre). `npm ls @nestjs/observe` confirma que está instalada (`0.3.1`) pero inerte.

### A-2 — Falta respuesta `500` documentada
`contrato.md:35-38` (endpoint 1) y `contrato.md:63-68` (endpoint 2) documentan explícitamente:
```
| 500 | Error del servidor | Objeto de error |
```
Pero `productos.controller.ts:18-43` solo declara:
```ts
@ApiOkResponse({ ... })                 // findAll
@ApiOkResponse({ ... })
@ApiBadRequestResponse({ ... })         // findOne
@ApiNotFoundResponse({ ... })
```
No hay ningún `@ApiInternalServerErrorResponse` (ni `@ApiResponse({status: 500, ...})`) en ninguno de los dos métodos. Swagger UI no reflejará ese código de respuesta pese a estar en el contrato.

### M-1 — Duplicación `Producto` / `ProductoDto`
`productos.service.ts:3-7`:
```ts
export interface Producto {
  id: number;
  nombre: string;
  precio: number;
}
```
`producto.dto.ts:3-11`:
```ts
export class ProductoDto {
  @ApiProperty(...) id: number;
  @ApiProperty(...) nombre: string;
  @ApiProperty(...) precio: number;
}
```
`productos.controller.ts:25-27` y `41-43` devuelven `Producto` (el tipo del servicio), mientras que la documentación Swagger (`type: ProductoDto`) referencia una clase distinta y desacoplada. Funciona porque `@ApiOkResponse` solo lee metadata en tiempo de compilación de documentación, pero ambos tipos deben mantenerse sincronizados manualmente: si se agrega un campo a `Producto` y se olvida en `ProductoDto` (o viceversa), la documentación Swagger queda desactualizada sin que TypeScript lo detecte.

### M-2 — Cobertura de pruebas insuficiente
`productos.controller.spec.ts:17-19` y `productos.service.spec.ts:15-17`:
```ts
it('should be defined', () => {
  expect(controller).toBeDefined();
});
```
Son los únicos `it(...)` de ambos archivos. No existe ninguna prueba que verifique:
- `findAll()` devuelve el arreglo de 3 productos esperado.
- `findOne(1)` devuelve el producto correcto.
- `findOne(999)` lanza `NotFoundException`.
- El pipe `ParseIntPipe` responde `400` ante un `id` no numérico (a nivel e2e).

### M-3 — Falta `@ApiParam`
`productos.controller.ts:29-43`, método `findOne`, no incluye `@ApiParam({ name: 'id', ... })`. Swagger lo infiere automáticamente desde `@Param('id')`, pero sin descripción ni ejemplo, a diferencia del resto de la documentación que sí es explícita (`@ApiOperation`, `@ApiOkResponse`, etc.).

### B-1 — `no-explicit-any` deshabilitada
`.oxlintrc.json:4`:
```json
"typescript/no-explicit-any": "off",
```

### B-2 — `strictPropertyInitialization: false`
`tsconfig.json:20-21`:
```json
"strict": true,
"strictPropertyInitialization": false
```
Se desactiva puntualmente para que `ProductoDto` compile sin inicializar sus propiedades (`id: number;` sin valor por defecto), debilitando el modo estricto general del proyecto.

### B-3 — `AppController` sin documentar
`src/app.controller.ts:1-12` no tiene `@ApiTags` ni `@ApiOperation`, y al estar bajo `app.setGlobalPrefix('api/v1')` (`main.ts:8`), queda expuesto como `GET /api/v1` sin clasificar en Swagger UI, mezclado visualmente con el grupo `productos`.

### B-4 — Sin `ValidationPipe` global
`main.ts:1-20` no configura `app.useGlobalPipes(new ValidationPipe())`, y `package.json` no incluye `class-validator` ni `class-transformer`. No es un incumplimiento del contrato actual (solo hay `GET`, sin `body`), pero es una brecha a prever antes de agregar `POST`/`PUT`.

---

## 4. Recomendación de corrección

### C-1 — Registrar el avance en Git
No es una corrección de código; ejecutar en terminal (respetando `.gitignore` ya presente):
```bash
git add .
git commit -m "feat: API productos NestJS + Swagger (semana 1)"
```

### A-1 — Eliminar dependencia no usada
`package.json`:
```diff
   "dependencies": {
     "@nestjs/common": "^12.0.1",
     "@nestjs/core": "^12.0.1",
-    "@nestjs/observe": "^0.3.0",
     "@nestjs/platform-express": "^12.0.1",
     "@nestjs/swagger": "^12.0.1",
     "reflect-metadata": "^0.2.2",
     "rxjs": "^7.8.1"
   },
```
Luego: `npm install` para regenerar `package-lock.json` sin el paquete.

### A-2 — Documentar respuesta 500
`productos.controller.ts`:
```ts
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

// ...

@Get()
@ApiOperation({ summary: 'Listar productos disponibles' })
@ApiOkResponse({
  description: 'Lista de productos disponibles.',
  type: ProductoDto,
  isArray: true,
})
@ApiInternalServerErrorResponse({ description: 'Error interno del servidor.' })
findAll(): Producto[] {
  return this.productosService.findAll();
}

@Get(':id')
@ApiOperation({ summary: 'Obtener un producto por id' })
@ApiOkResponse({ description: 'Producto encontrado.', type: ProductoDto })
@ApiBadRequestResponse({ description: 'El id enviado no es un número entero.' })
@ApiNotFoundResponse({ description: 'No existe un producto con ese id.' })
@ApiInternalServerErrorResponse({ description: 'Error interno del servidor.' })
findOne(@Param('id', ParseIntPipe) id: number): Producto {
  return this.productosService.findOne(id);
}
```

### M-1 — Unificar el modelo de dominio y el DTO
`producto.dto.ts` (hace que el compilador obligue a mantener sincronizados ambos tipos):
```ts
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
```
Con `implements Producto`, si el `interface` cambia y `ProductoDto` no se actualiza, TypeScript falla en tiempo de compilación en lugar de quedar desincronizado en silencio.

### M-2 — Ampliar pruebas unitarias
`productos.service.spec.ts`:
```ts
import { NotFoundException } from '@nestjs/common';
// ...

it('findAll devuelve el catálogo completo', () => {
  const productos = service.findAll();
  expect(productos).toHaveLength(3);
  expect(productos[0]).toEqual({ id: 1, nombre: 'Teclado mecánico', precio: 45.9 });
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
```
`productos.controller.spec.ts`:
```ts
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
```
(Nota: `service` debe obtenerse en `beforeEach` con `module.get<ProductosService>(ProductosService)`.)

### M-3 — Agregar `@ApiParam`
`productos.controller.ts`:
```ts
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';

@Get(':id')
@ApiOperation({ summary: 'Obtener un producto por id' })
@ApiParam({ name: 'id', type: Number, example: 1, description: 'Identificador numérico del producto' })
@ApiOkResponse({ description: 'Producto encontrado.', type: ProductoDto })
@ApiBadRequestResponse({ description: 'El id enviado no es un número entero.' })
@ApiNotFoundResponse({ description: 'No existe un producto con ese id.' })
findOne(@Param('id', ParseIntPipe) id: number): Producto {
  return this.productosService.findOne(id);
}
```

### B-1 — Reforzar tipado estricto en el linter
`.oxlintrc.json`:
```diff
   "rules": {
-    "typescript/no-explicit-any": "off",
+    "typescript/no-explicit-any": "warn",
     "typescript/no-floating-promises": "error"
   },
```
(usar `"error"` si el equipo prefiere bloquear el build ante cualquier `any` explícito).

### B-2 — Evitar relajar `strict` globalmente
`tsconfig.json`:
```diff
     "strict": true,
-    "strictPropertyInitialization": false
```
y en `producto.dto.ts`, usar aserción de asignación definitiva en vez de desactivar la regla del proyecto completo:
```ts
export class ProductoDto implements Producto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Teclado mecánico' }) nombre!: string;
  @ApiProperty({ example: 45.9 }) precio!: number;
}
```

### B-3 — Excluir o documentar el controlador raíz
Opción rápida (excluirlo de Swagger, ya que es solo boilerplate):
```ts
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController { ... }
```
o, si se desea mantenerlo visible, documentarlo igual que `ProductosController` con `@ApiTags('app')` y `@ApiOperation`.

### B-4 — Preparar validación para futuros endpoints
```bash
npm install class-validator class-transformer
```
`main.ts`:
```ts
import { ValidationPipe } from '@nestjs/common';
// ...
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

---

## 5. Pruebas de verificación

Tras aplicar las correcciones, validar lo siguiente:

**En terminal:**
1. `npm run build` — debe compilar sin errores (ya lo hace hoy; confirmar que sigue así tras los cambios).
2. `npm run lint` — debe seguir en verde, especialmente tras el cambio en B-1.
3. `npm test` — todas las suites en verde, y confirmar que las nuevas pruebas de M-2 (`findAll`, `findOne` éxito/`NotFoundException`) efectivamente fallan si se rompe la lógica del servicio (sanity check: comentar temporalmente el `throw` y ver que el test lo detecta, luego revertir).
4. `git log --oneline` — debe mostrar al menos un commit (C-1) con los archivos de `src/` incluidos (`git show --stat HEAD`).
5. `npm ls @nestjs/observe` — debe responder `(empty)` tras aplicar A-1.

**En Swagger UI (`http://localhost:3000/api/docs`) con `npm run start:dev`:**
6. El grupo **productos** debe listar `GET /api/v1/productos` y `GET /api/v1/productos/{id}`.
7. En `GET /api/v1/productos/{id}`, el desplegable "Responses" debe mostrar **200, 400, 404 y 500** (A-2), y el parámetro `id` debe traer la descripción/ejemplo configurados en M-3.
8. El esquema (`Schemas` al final de la página) debe mostrar un único modelo `ProductoDto` con `id`, `nombre`, `precio`, coherente con lo que devuelven los endpoints "Try it out".
9. Ejecutar "Try it out" en `GET /api/v1/productos/abc` → debe responder `400` con el cuerpo `{ statusCode, message, error }` tal como especifica `contrato.md`.
10. Ejecutar "Try it out" en `GET /api/v1/productos/999` → debe responder `404` con `Producto con id 999 no encontrado`.
11. Si se aplicó B-3, el endpoint raíz (`GET /api/v1`) ya no debe aparecer sin categorizar en la página de Swagger (o debe aparecer correctamente etiquetado bajo un grupo propio).
