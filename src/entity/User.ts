import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { MinLength } from 'class-validator';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  @MinLength(7)
  password!: string;

  @Column()
  birthDate!: string;
}
