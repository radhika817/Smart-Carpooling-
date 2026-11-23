import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateRideModal } from '../components/safety/RateRideModal';
import { reviewService } from '../services/reviewService';

vi.mock('../services/reviewService', () => ({
  reviewService: {
    createReview: vi.fn(),
  },
}));

describe('RateRideModal Component', () => {
  const defaultRideId = 'ride_abc_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders passenger selection dropdown when multiple passengers are provided', () => {
    const passengers = [
      { _id: 'p_1', name: 'Aarav Patel', email: 'aarav@test.com' },
      { _id: 'p_2', name: 'Sneha Sharma', email: 'sneha@test.com' },
    ];

    render(
      <RateRideModal
        isOpen={true}
        onClose={vi.fn()}
        rideId={defaultRideId}
        passengers={passengers}
        targetUser={passengers[0]}
      />
    );

    expect(screen.getByText(/Select Passenger to Review/i)).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Aarav Patel (aarav@test.com)')).toBeInTheDocument();
    expect(screen.getByText('Sneha Sharma (sneha@test.com)')).toBeInTheDocument();
  });

  it('submits rating for the selected passenger with correct target user ID', async () => {
    const passengers = [
      { _id: 'p_1', name: 'Aarav Patel', email: 'aarav@test.com' },
      { _id: 'p_2', name: 'Sneha Sharma', email: 'sneha@test.com' },
    ];

    reviewService.createReview.mockResolvedValueOnce({ success: true });

    render(
      <RateRideModal
        isOpen={true}
        onClose={vi.fn()}
        rideId={defaultRideId}
        passengers={passengers}
        targetUser={passengers[0]}
      />
    );

    // Switch dropdown to Sneha Sharma (p_2)
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'p_2' } });

    // Reviewing header updates
    expect(screen.getByText('Sneha Sharma')).toBeInTheDocument();

    // Type optional comment
    const commentInput = screen.getByPlaceholderText(/Share specific details about this commute/i);
    fireEvent.change(commentInput, { target: { value: 'Very punctual and polite passenger!' } });

    // Submit review
    const submitBtn = screen.getByRole('button', { name: /Submit rating/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewService.createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          rideId: defaultRideId,
          toUserId: 'p_2',
          comment: 'Very punctual and polite passenger!',
          overall: 5,
          punctuality: 5,
          safety: 5,
          behaviour: 5,
          cleanliness: 5,
        })
      );
    });

    expect(screen.getByText(/Thank you for rating!/i)).toBeInTheDocument();
  });

  it('displays warning when neither passengers nor target user are present', () => {
    render(
      <RateRideModal
        isOpen={true}
        onClose={vi.fn()}
        rideId={defaultRideId}
        passengers={[]}
        targetUser={null}
      />
    );

    expect(
      screen.getByText(/No passenger or driver was found on this ride to review/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit rating/i });
    fireEvent.click(submitBtn);

    expect(reviewService.createReview).not.toHaveBeenCalled();
    expect(screen.getByText(/No target passenger\/driver specified to review/i)).toBeInTheDocument();
  });
});
