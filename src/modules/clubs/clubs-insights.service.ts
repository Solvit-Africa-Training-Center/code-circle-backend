import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { CurrentUserPayload } from '../auth/strategies/jwt.strategy';
import { Club } from './entities/club.entity';
import { Membership, MembershipStatus } from '../users/entities/membership.entity';
import { Course } from '../course/entities/course.entity';
import { Project } from '../project/entities/project.entity';
import { User } from '../users/entities/user.entity';

type ClubStats = {
  clubId: string;
  membersCount: number;
  projectsCount: number;
};

type ClubMember = {
  userId: string;
  membershipId: string;
  fullName: string;
  email: string;
  status: MembershipStatus;
  joinedAt: Date;
};

@Injectable()
export class ClubsInsightsService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getClubStats(clubId: string): Promise<ClubStats> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID "${clubId}" not found`);
    }

    const membersCount = await this.membershipRepository.count({
      where: {
        clubId,
        status: MembershipStatus.ACTIVE,
      },
    });

    const courses = await this.courseRepository.find({
      where: { clubId },
      select: ['id'],
    });
    const courseIds = courses.map((course) => course.id);

    const projectsCount =
      courseIds.length > 0
        ? await this.projectRepository
            .createQueryBuilder('project')
            .where('project.courseId IN (:...courseIds)', { courseIds })
            .getCount()
        : 0;

    return {
      clubId,
      membersCount,
      projectsCount,
    };
  }

  async getClubMembers(
    clubId: string,
    currentUser: CurrentUserPayload,
  ): Promise<ClubMember[]> {
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException(`Club with ID "${clubId}" not found`);
    }

    const isAdmin = currentUser.roles.some((role) => role.name === 'ADMIN');
    if (!isAdmin && club.creatorId !== currentUser.userId) {
      throw new ForbiddenException(
        'You can only view members for clubs you created',
      );
    }

    const memberships = await this.membershipRepository.find({
      where: {
        clubId,
        status: In([MembershipStatus.ACTIVE, MembershipStatus.PENDING]),
      },
      order: {
        joinedAt: 'DESC',
      },
    });

    if (!memberships.length) {
      return [];
    }

    const users = await this.userRepository.find({
      where: memberships.map((membership) => ({ id: membership.userId })),
      select: ['id', 'name', 'email'],
    });

    const userById = new Map(users.map((user) => [user.id, user]));

    return memberships.map((membership) => {
      const user = userById.get(membership.userId);
      return {
        userId: membership.userId,
        membershipId: membership.id,
        fullName: user?.name ?? 'Unknown User',
        email: user?.email ?? '',
        status: membership.status,
        joinedAt: membership.joinedAt,
      };
    });
  }
}
