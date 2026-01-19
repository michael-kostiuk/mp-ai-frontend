import React, { useState, useEffect } from 'react';
import { useApiContext } from '../../context/ApiContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';

const ApiConfigPanel: React.FC = () => {
  const { config, updateConfig } = useApiContext();
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [timeout, setTimeoutValue] = useState(config.timeout);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      updateConfig({ baseUrl, timeout });

      // Small delay to show saving state
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update API configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current config values
    setBaseUrl(config.baseUrl);
    setTimeoutValue(config.timeout);
    setIsEditing(false);
  };

  // Update form when config changes externally
  useEffect(() => {
    if (!isEditing) {
      setBaseUrl(config.baseUrl);
      setTimeoutValue(config.timeout);
    }
  }, [config, isEditing]);

  return (
    <Card className="mt-8 mb-8">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="API Base URL"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                fullWidth
                placeholder="https://mealplanner-eu.onrender.com"
                required
                helperText="The base URL for your meal planning API server"
              />

              <Input
                label="Request Timeout (ms)"
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutValue(Number(e.target.value))}
                fullWidth
                min={1000}
                max={60000}
                step={1000}
                required
                helperText="How long to wait for API responses before timing out"
              />
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-neutral-500">API Base URL</h4>
              <p className="mt-1 text-sm text-neutral-900 font-mono bg-neutral-50 px-2 py-1 rounded">
                {config.baseUrl}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-500">Request Timeout</h4>
              <p className="mt-1 text-sm text-neutral-900">
                {config.timeout}ms ({(config.timeout / 1000).toFixed(1)} seconds)
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isEditing ? (
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Configuration
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApiConfigPanel;
