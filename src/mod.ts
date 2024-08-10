import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";
import path from "path";

interface ModConfig {
    HallofFame: Record<string, HoFsettings>;
}

interface HoFsettings {
    filter: string[];
}

class Mod implements IPostDBLoadMod {
    private modConfig: ModConfig;

    postDBLoad(container: DependencyContainer): void {
        const vfs = container.resolve<VFS>("VFS");
        this.modConfig = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../src/config.jsonc")));

        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

        // Get all the in-memory json found in /assets/database
        const tables: IDatabaseTables = databaseServer.getTables();

        // Bridging our config file to the table edits
        this.addItemToTrophyStand(tables, this.modConfig.HallofFame);
    }

    private addItemToTrophyStand(tables: IDatabaseTables, hofSettings: Record<string, HoFsettings>): void {
        const templates = tables.templates.items;
        const itemsToUpdate = [
            "63dbd45917fff4dee40fe16e",
            "65424185a57eea37ed6562e9",
            "6542435ea57eea37ed6562f0"
        ];

        itemsToUpdate.forEach(itemID => {
            const item = templates[itemID];
            if (item && item._props && item._props.Slots) {
                const slots = item._props.Slots;
                slots.forEach((slot: any) => {
                    if (slot._name.includes("bigTrophies")) {
                        slot._props.filters.forEach((filterGroup: { Filter: string[] }) => {
                            // Apply all filters from the HoFsettings
                            Object.values(hofSettings).forEach(setting => {
                                filterGroup.Filter.push(...setting.filter);
                            });
                        });
                    }
                });
            }
        });
    }
}

export const mod = new Mod();
