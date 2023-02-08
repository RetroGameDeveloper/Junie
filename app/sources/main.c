#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <SDL2/SDL.h>

#include "app.h"

static bool environment(uint32_t cmd, void *data, void *opaque)
{
	JUN_App *app = opaque;

	return JUN_CoreEnvironment(cmd, data);
}

static void video_refresh(const void *data, uint32_t width, uint32_t height, size_t pitch, void *opaque)
{
	JUN_App *app = opaque;

	enum retro_pixel_format format = JUN_CoreGetFormat();
	JUN_VideoUpdateContext(app->video, format, width, height, pitch);

	JUN_VideoClear(app->video);
	JUN_VideoDrawFrame(app->video, data);
	JUN_VideoDrawUI(app->video);
	JUN_VideoPresent(app->video);
}

static size_t audio_sample(const int16_t *data, size_t frames, void *opaque)
{
	JUN_App *app = opaque;

	if (JUN_StateHasAudio(app->state))
		JUN_AudioQueue(app->audio, data, frames);

	return frames;
}

static void input_poll(void *opaque)
{
	JUN_App *app = opaque;

	JUN_InputPollEvents(app->input);
}

static int16_t input_state(uint32_t port, uint32_t device, uint32_t index, uint32_t id, void *opaque)
{
	JUN_App *app = opaque;

	if (port != 0)
		return 0;

	return JUN_InputGetStatus(app->input, id, device);
}

static void run_game(JUN_App *app)
{
	double sample_rate = JUN_CoreGetSampleRate();
	double frames_per_second = JUN_CoreGetFramesPerSecond();
	JUN_AudioOpen(app->audio, sample_rate, frames_per_second);

	while (!JUN_StateShouldExit(app->state)) {
		uint8_t fast_forward = JUN_StateGetFastForward(app->state);

		JUN_AudioUpdate(app->audio, fast_forward);
		JUN_CoreRun(fast_forward);

		if (JUN_StateShouldSaveState(app->state)) {
			JUN_CoreSaveState();
			JUN_StateToggleSaveState(app->state);
		}

		if (JUN_StateShouldRestoreState(app->state)) {
			JUN_CoreRestoreState();
			JUN_StateToggleRestoreState(app->state);
		}
	}
}

char *get_settings()
{
	SDL_LogSetAllPriority(SDL_LOG_PRIORITY_CRITICAL);

	return JUN_CoreGetDefaultConfiguration(NULL);
}

int main(int argc, const char *argv[])
{
	const char *system = argv[1];
	const char *rom = argv[2];
	const char *settings = argv[3];

	JUN_App *app = JUN_AppCreate();

	JUN_CoreCreate(system, rom, settings, NULL);

	JUN_CoreSetCallbacks(& (JUN_CoreCallbacks) {
		.opaque             = app,
		.environment        = environment,
		.video_refresh      = video_refresh,
		.audio_sample       = audio_sample,
		.input_poll         = input_poll,
		.input_state        = input_state,
	});

	if (!JUN_CoreStartGame()) {
		SDL_LogInfo(0, "Core for system '%s' failed to start rom '%s'", system, rom);
		return 1;
	}

	run_game(app);

	JUN_CoreDestroy();
	JUN_AppDestroy(&app);

	return 0;
}
