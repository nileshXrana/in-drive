import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRideCoordinates1786346976484 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('ride_request', [
      new TableColumn({
        name: 'pickupLatitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickupLongitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dropoffLatitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dropoffLongitude',
        type: 'double precision',
        isNullable: true,
      }),
    ]);

    await queryRunner.addColumns('rides', [
      new TableColumn({
        name: 'pickupLatitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickupLongitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dropoffLatitude',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dropoffLongitude',
        type: 'double precision',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('rides', [
      'pickupLatitude',
      'pickupLongitude',
      'dropoffLatitude',
      'dropoffLongitude',
    ]);

    await queryRunner.dropColumns('ride_request', [
      'pickupLatitude',
      'pickupLongitude',
      'dropoffLatitude',
      'dropoffLongitude',
    ]);
  }
}
