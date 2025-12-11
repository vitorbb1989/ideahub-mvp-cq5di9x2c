import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Idea } from '../../ideas/entities/idea.entity';
import { Document } from '../../documents/entities/document.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  // Hashed refresh token for secure token rotation
  // select: false means it won't be returned in queries by default
  @Column({ nullable: true, select: false })
  @Exclude()
  refreshToken: string | null;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Idea, (idea) => idea.user)
  ideas: Idea[];

  @OneToMany(() => Document, (document) => document.user)
  documents: Document[];

  @OneToMany(() => Prompt, (prompt) => prompt.user)
  prompts: Prompt[];
}
