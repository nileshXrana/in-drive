import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class rideRequest1786346976483 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'ride_request',
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
                    },
                    {
                        name: 'notes',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
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
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'ride_request',
            new TableForeignKey({
                columnNames: ['riderUuid'],
                referencedTableName: 'user',
                referencedColumnNames: ['uuid'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('ride_request');
    }
}
