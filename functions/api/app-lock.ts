interface Env {
  SETTINGS_KV: KVNamespace;
}

interface LockStatus {
  locked: boolean;
}

interface LockToggleRequest {
  locked: boolean;
}

interface LockToggleResponse {
  locked: boolean;
  success: boolean;
}

interface ErrorResponse {
  error: string;
}

const KV_KEY = 'app_locked';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const value = await context.env.SETTINGS_KV.get(KV_KEY);
    const locked = value === 'true';

    const response: LockStatus = { locked };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading lock status:', error);
    // Default to unlocked if KV fails
    const response: LockStatus = { locked: false };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as LockToggleRequest;

    if (typeof body.locked !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid locked field' } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await context.env.SETTINGS_KV.put(KV_KEY, String(body.locked));

    const response: LockToggleResponse = {
      locked: body.locked,
      success: true,
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error toggling lock status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update lock status' } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
