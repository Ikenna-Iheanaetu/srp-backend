/** @format */

import {
	getDirtyValues,
	normalizeFileFields,
	PathSupportingFile,
} from "./forms";

describe("getDirtyValues", () => {
	test("returns only dirty values, including nested objects, and includes the full array if any item is modified", () => {
		const dirtyFields = {
			name: true,
			address: {
				street: true,
				phoneNumbers: [null, true],
			},
		};
		const allValues = {
			name: "Bill",
			friend: true,
			address: {
				street: "Main",
				phoneNumbers: ["unchanged", "new"],
			},
		};

		expect(getDirtyValues(dirtyFields, allValues)).toEqual({
			name: "Bill",
			address: {
				street: "Main",
				phoneNumbers: ["unchanged", "new"],
			},
		});
	});

	test("getDirtyValues with first array item modified must return the entire array", () => {
		const dirtyFields = {
			address: {
				country: {
					state: {
						city: true,
					},
				},
				phoneNumbers: [true],
			},
		};
		const allValues = {
			address: {
				country: {
					state: {
						city: "Sydney",
						neighborCity: "Melbs",
					},
				},
				phoneNumbers: ["changed", "but others follow"],
			},
		};

		expect(getDirtyValues(dirtyFields, allValues)).toEqual({
			address: {
				country: {
					state: {
						city: "Sydney",
					},
				},
				phoneNumbers: ["changed", "but others follow"],
			},
		});
	});

	test("returns the full array of objects when at least one item is modified", () => {
		const dirtyFields = {
			friends: [true],
		};
		const allValues = {
			friends: [
				{ first: "Bill", last: "Maher" },
				{ first: "Dan", last: "DV" },
			],
		};
		expect(getDirtyValues(dirtyFields, allValues)).toEqual({
			friends: [
				{ first: "Bill", last: "Maher" },
				{ first: "Dan", last: "DV" },
			],
		});
	});

	test("excludes explicitly clean fields from the dirty values result", () => {
		const dirtyFields = {
			dirtyField: true,
			cleanField: false,
			nullField: null,
		};
		const allValues = {
			dirtyField: "Dirty",
			cleanField: "Clean",
			nullField: "Also Clean",
		};

		expect(getDirtyValues(dirtyFields, allValues)).toEqual({
			dirtyField: "Dirty",
		});
	});
});

class File {
	name: string;
	size: number;
	type: string;
	constructor(name: string, size: number, type: string) {
		this.name = name;
		this.size = size;
		this.type = type;
	}
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
globalThis.File = File as any;

describe("transformFileFields", () => {
	const file1 = new File("doc1.pdf", 100, "application/pdf");
	const file2 = new File("img.png", 200, "image/png");
	const untouchedString = "do not touch me";
	const untouchedArray = [1, 2, "three"];
	const untouchedObject = { key: "value", id: 101 };

	it("should only process fields specified in fileFieldPaths, leaving all others untouched, and handles an empty path list correctly", () => {
		const inputData = {
			a: {
				fileArray: [file1, "old-link.jpg", undefined, null, file2],
			},
			b: {
				singleString: "old-id-123",
			},
			c: {
				emptyArray: [undefined, null, "string-to-be-removed"],
			},
			d: {
				untouchedString: untouchedString,
				untouchedNumber: 42,
			},
			e: untouchedArray,
			f: {
				untouchedObject: untouchedObject,
				nested: {
					value: "deeply nested",
					file: file1,
				},
			},
		};
		const targetedPaths = [
			"a.fileArray",
			"b.singleString",
			"c.emptyArray",
		] as unknown as PathSupportingFile<typeof inputData>[];

		// Case 1: Targeted Fields
		const resultTargeted = normalizeFileFields(inputData, targetedPaths);

		// Targeted fields verification
		expect(resultTargeted.a.fileArray).toEqual([file1, file2]);
		expect(resultTargeted.b).not.toHaveProperty("singleString");
		expect(resultTargeted.c).not.toHaveProperty("emptyArray");

		// Non-targeted fields verification
		expect(resultTargeted.d.untouchedString).toBe(untouchedString);
		expect(resultTargeted.e).toBe(untouchedArray);
		expect(resultTargeted.f.nested.file).toBe(file1);

		// Case 2: Empty Path List
		const resultEmpty = normalizeFileFields(inputData, []);

		expect(resultEmpty).toEqual(inputData);

		// Ensure object references are maintained for top-level keys
		expect(resultEmpty.a).toBe(inputData.a);
		expect(resultEmpty.e).toBe(inputData.e);
	});

	it("should purify fields, keeping only File objects when onlyFiles is true (default)", () => {
		const nonFileObject = { id: 99, status: "pending" };
		const inputData = {
			// Array purification test (keeps file1 and file2, removes the rest)
			arrayField: [
				file1,
				"old-link.jpg",
				undefined,
				null,
				nonFileObject,
				file2,
				123,
				true,
			],

			// Single field purification tests (all invalid, should be removed/undefined)
			singleString: "http://link.com/old",
			singleNull: null,
			singleNumber: 500,
			singleObject: nonFileObject,

			// Control field - should be kept
			singleFile: file1,

			// Untouched control
			untouched: "safe",
		};
		const targetedPaths = [
			"arrayField",
			"singleString",
			"singleNull",
			"singleNumber",
			"singleObject",
			"singleFile",
		] as unknown as PathSupportingFile<typeof inputData>[];

		// The default behavior is { onlyFiles: true }
		const result = normalizeFileFields(inputData, targetedPaths);

		// 1. Array purification: only File instances remain
		expect(result.arrayField).toEqual([file1, file2]);

		// 2. Invalid single values are removed (set to undefined/deleted)
		expect(result).not.toHaveProperty("singleString");
		expect(result).not.toHaveProperty("singleNull");
		expect(result).not.toHaveProperty("singleNumber");
		expect(result).not.toHaveProperty("singleObject");

		// 3. Valid File object is kept
		expect(result.singleFile).toBe(file1);

		// 4. Untouched control remains
		expect(result.untouched).toBe("safe");
	});

	it("should keep strings alongside File objects when onlyFiles is set to false", () => {
		const nonFileObject = { id: 99, status: "pending" };
		const oldString = "http://link.com/old-id-123";
		const oldArrayString = "old-link-in-array.jpg";

		const inputData = {
			// Array test: Should keep file1, file2, and oldArrayString. Remove null/undefined/objects.
			arrayField: [
				file1,
				oldArrayString,
				undefined,
				null,
				nonFileObject,
				file2,
				123,
				true,
			],

			// Single field test: Should keep oldString and file1. Remove null/number/object.
			singleString: oldString,
			singleNull: null,
			singleNumber: 500,
			singleObject: nonFileObject,
			singleFile: file1,

			untouched: "safe",
		};
		const targetedPaths = [
			"arrayField",
			"singleString",
			"singleNull",
			"singleNumber",
			"singleObject",
			"singleFile",
		] as unknown as PathSupportingFile<typeof inputData>[];

		const result = normalizeFileFields(inputData, targetedPaths, {
			onlyFiles: false,
		});

		// 1. Array purification: Keeps File instances AND strings
		expect(result.arrayField).toEqual([file1, oldArrayString, file2]);

		// 2. String/File single values are kept
		expect(result.singleString).toBe(oldString);
		expect(result.singleFile).toBe(file1);

		// 3. Other invalid non-string/non-File values are removed
		expect(result).not.toHaveProperty("singleNull");
		expect(result).not.toHaveProperty("singleNumber");
		expect(result).not.toHaveProperty("singleObject");

		// 4. Untouched control remains
		expect(result.untouched).toBe("safe");
	});
});
