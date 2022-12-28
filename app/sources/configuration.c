#include <stdlib.h>

#include "configuration.h"

typedef struct JUN_ConfigurationElement JUN_ConfigurationElement;

struct JUN_Configuration
{
	MTY_Hash *values;
	MTY_Hash *overrides;
};

struct JUN_ConfigurationElement
{
	char *key;
	char *description;
	MTY_List *values;
};

JUN_Configuration *JUN_ConfigurationCreate()
{
	JUN_Configuration *this = calloc(1, sizeof(JUN_Configuration));

	this->values = MTY_HashCreate(0);
	this->overrides = MTY_HashCreate(0);

	return this;
}

char *JUN_ConfigurationGet(JUN_Configuration *this, const char *key)
{
	char *value = MTY_HashGet(this->overrides, key);
	if (value)
		return value;

	JUN_ConfigurationElement *element = MTY_HashGet(this->values, key);
	if (!element)
		return NULL;

	MTY_ListNode *node = MTY_ListGetFirst(element->values);
	if (!node)
		return NULL;

	return (char *) node->value;
}

void JUN_ConfigurationSet(JUN_Configuration *this, const char *key, const char *value)
{
	JUN_ConfigurationElement *element = calloc(1, sizeof(JUN_ConfigurationElement));

	char *content = MTY_Strdup(value);

	char *saveptr = NULL;

	element->key = MTY_Strdup(key);
	element->description = MTY_Strdup(MTY_Strtok(content, ";", &saveptr));
	element->values = MTY_ListCreate();

	char *options = saveptr + 1;
	saveptr = NULL;

	char *config = MTY_Strtok(options, "|", &saveptr);
	while (config) {
		MTY_ListAppend(element->values, MTY_Strdup(config));

		config = MTY_Strtok(NULL, "|", &saveptr);
	}

	MTY_HashSet(this->values, key, element);

	free(content);
}

void JUN_ConfigurationOverride(JUN_Configuration *this, const char *key, const char *value)
{
	MTY_HashSet(this->overrides, MTY_Strdup(key), MTY_Strdup(value));
}

void JUN_ConfigurationDestroy(JUN_Configuration **configuration)
{
	if (!configuration || !*configuration)
		return;

	JUN_Configuration *this = *configuration;

	MTY_HashDestroy(&this->values, free);
	MTY_HashDestroy(&this->overrides, free);

	free(this);
	*configuration = NULL;
}
