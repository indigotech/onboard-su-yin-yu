import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 'User Name' })
  name!: string;

  @Column({ default: 'name@email.com' })
  email!: string;

  @Column({ default: 'password' })
  password!: string;

  @Column({ default: '01-01-1990' })
  birthDate!: string;
}
