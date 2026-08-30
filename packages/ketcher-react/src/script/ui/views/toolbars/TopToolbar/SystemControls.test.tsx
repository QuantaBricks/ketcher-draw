import { render, screen } from '@testing-library/react';

import { SystemControls } from './SystemControls';

jest.mock('ketcher-core', () => ({
  shortcutStr: () => 'Shift+/',
}));

jest.mock('./TopToolbarIconButton', () => ({
  TopToolbarIconButton: ({
    testId,
    iconName,
    title,
    onClick,
  }: {
    testId: string;
    iconName: string;
    title: string;
    onClick: () => void;
  }) => (
    <button
      data-icon-name={iconName}
      data-testid={testId}
      onClick={onClick}
      title={title}
    />
  ),
}));

describe('SystemControls', () => {
  const defaultProps = {
    disabledButtons: [],
    hiddenButtons: [],
    onAboutOpen: jest.fn(),
    onHelp: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders help and about buttons', () => {
    render(<SystemControls {...defaultProps} />);

    expect(screen.getByTestId('help-button')).toHaveAttribute(
      'data-icon-name',
      'help',
    );
    expect(screen.getByTestId('about-button')).toHaveAttribute(
      'data-icon-name',
      'about',
    );
  });
});
