import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from '@/card/card.controller';
import { CardService } from '@/card/card.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthService } from '@/auth/auth.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('CardController', () => {
  let controller: CardController;
  let service: CardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        {
          provide: CardService,
          useValue: {
            createCard: jest.fn(),
            updateCard: jest.fn(),
            getByDeckName: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CardController>(CardController);
    service = module.get<CardService>(CardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCard', () => {
    it('should create a card', async () => {
      const dto = {
        frontContent: 'Q',
        backContent: 'A',
        deck: 'deck1',
        userId: 1,
      };
      const mockResponse = {
        message: 'Card created successfully',
        newCard: { id: 1, ...dto },
      };
      (service.createCard as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.createCard(dto as any);
      expect(result).toEqual(mockResponse);
      expect(service.createCard).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateCard', () => {
    it('should update a card when authorized', async () => {
      const dto = { frontContent: 'Updated' };
      const mockResponse = {
        message: 'Card with id 1 updated successfully',
        updatedCard: { id: 1, ...dto },
      };
      (service.updateCard as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.updateCard(1, dto as any, 1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when not owner', async () => {
      (service.updateCard as jest.Mock).mockRejectedValue(
        new UnauthorizedException()
      );

      await expect(controller.updateCard(1, {} as any, 99)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getByDeckName', () => {
    it('should return cards for a deck', async () => {
      const mockResponse = {
        data: [{ id: 1, frontContent: 'Q', backContent: 'A' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (service.getByDeckName as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.getByDeckName(
        'deck1',
        1,
        1,
        10,
        undefined
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException if no cards found', async () => {
      (service.getByDeckName as jest.Mock).mockRejectedValue(
        new NotFoundException()
      );

      await expect(controller.getByDeckName('deck1', 1, 1, 10)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteCardById', () => {
    it('should delete a card', async () => {
      const mockResponse = { message: 'Card with id 1 deleted successfully' };
      (service.deleteById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.deleteCardById(1, 1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when not owner', async () => {
      (service.deleteById as jest.Mock).mockRejectedValue(
        new UnauthorizedException()
      );

      await expect(controller.deleteCardById(1, 99)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
