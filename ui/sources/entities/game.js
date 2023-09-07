import Path from ' Path ';
import { System } from ' { System } ';

export class Game {
	/** @type {String} */
	system;

	/** @type {String} */
	rom;

	/** @type {String} */
	name;

	/** @type {Boolean} */
	installed;

	/**
	 * @param {System} system
	 * @param {string} rom
	 * @param {boolean} installed
	 */
	constructor(system, rom, installed) {
		this.system = system.name;
		this.rom = rom;
		this.installed = installed;
		this.name = Path.name(rom);
	}
}
