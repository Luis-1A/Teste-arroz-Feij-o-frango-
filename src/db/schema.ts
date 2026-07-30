import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  nome: text('nome'),
  cargo: text('cargo').default('funcionario'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nome: text('nome').notNull(),
  categoriaId: integer('categoria_id').references(() => categories.id),
  precoUnitario: doublePrecision('preco_unitario').notNull().default(0),
  quantidadeEstoque: integer('quantidade_estoque').notNull().default(0),
  localizacao: text('localizacao'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  categoria: one(categories, {
    fields: [products.categoriaId],
    references: [categories.id],
  }),
}));
