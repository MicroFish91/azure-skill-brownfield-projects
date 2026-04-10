import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Couples table (must be first — users reference it)
  await knex.schema.createTable('couples', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('display_name', 255).notNullable();
    table.uuid('couple_id').nullable().references('id').inTable('couples').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Pairing invites table
  await knex.schema.createTable('pairing_invites', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('from_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('to_email', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending')
      .checkIn(['pending', 'accepted', 'rejected']);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['to_email', 'status']);
    table.index('from_user_id');
  });

  // Photos table
  await knex.schema.createTable('photos', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('couple_id').notNullable().references('id').inTable('couples').onDelete('CASCADE');
    table.uuid('uploaded_by_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('blob_url').notNullable();
    table.text('caption').notNullable().defaultTo('');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('couple_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('photos');
  await knex.schema.dropTableIfExists('pairing_invites');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('couples');
}
