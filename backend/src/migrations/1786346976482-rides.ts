import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class rides1786346976482 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rides',
        columns: [
          {
            name: 'uuid',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'pickupLocation',
            type: 'varchar',
          },
          {
            name: 'dropoffLocation',
            type: 'varchar',
          },
          {
            name: 'fare',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'riderUuid',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'driverUuid',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('rides', [
      new TableForeignKey({
        columnNames: ['riderUuid'],
        referencedTableName: 'user',
        referencedColumnNames: ['uuid'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['driverUuid'],
        referencedTableName: 'user',
        referencedColumnNames: ['uuid'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('rides');
  }
}
