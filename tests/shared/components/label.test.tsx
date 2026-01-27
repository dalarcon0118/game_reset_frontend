import React from 'react';
import { render } from '@testing-library/react-native';
import { Label } from '@shared/components/label';

// Mock UI Kitten components
jest.mock('@ui-kitten/components', () => ({
  Text: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('Label Component Content Handling', () => {
  it('should join an array of strings with spaces', () => {
    const { getByText } = render(
      <Label>
        {["Hello", "World"]}
      </Label>
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should filter out null, undefined and booleans', () => {
    const { getByText } = render(
      <Label>
        {["Item", null, "Price", undefined, true, false, 10]}
      </Label>
    );
    expect(getByText('Item Price 10')).toBeTruthy();
  });

  it('should not render objects in an array', () => {
    const { getByText } = render(
      <Label>
        {["Data:", { id: 1 } as any]}
      </Label>
    );
    expect(getByText('Data:')).toBeTruthy();
    const content = getByText('Data:').props.children;
    expect(JSON.stringify(content)).not.toContain('JSON');
    expect(JSON.stringify(content)).not.toContain('{');
  });

  it('should not render a single object', () => {
    const { toJSON } = render(
      <Label value={{ error: "Failed" } as any} />
    );
    const json = toJSON() as any;
    // The child of the Text component should be empty string
    expect(json.children[0]).toBe("");
  });

  it('should trim extra spaces', () => {
    const { getByText } = render(
      <Label>
        {["  ", "Hello", null, "World  "]}
      </Label>
    );
    expect(getByText('Hello World')).toBeTruthy();
  });
});
