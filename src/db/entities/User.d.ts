import { ObjectId } from "bson";
import { Hobby } from "./Hobby";

export interface User {
    id: string;
    name: string;
    hobbies: Array<Hobby>;
}