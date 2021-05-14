import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cep!: number;

  @Column({ unique: true })
  street!: string;

  @Column()
  streetNumber!: number;

  @Column({ nullable: true })
  complement?: string;

  @Column()
  neighborhood!: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @ManyToOne(() => User, (user: User) => user.address, { onDelete: 'CASCADE' })
  user!: User;
}
