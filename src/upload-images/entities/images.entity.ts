import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column({ unique: true })
  hash: string;

  @Column()
  url: string;

  @Column()
  cloudinaryPublicId: string;

  @Column()
  size: number;

  @Column()
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;
}
