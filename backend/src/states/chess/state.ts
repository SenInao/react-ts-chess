import Game from "../../models/chess/Game";
import { Connection } from "../../server";

const threeMinQeue : Connection[] = []
const fiveMinQeue : Connection[] = []
const tenMinQeue : Connection[] = []

const games : Game[] = []

export {threeMinQeue, fiveMinQeue, tenMinQeue, games}
