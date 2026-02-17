import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { List } from "../models/List.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

async function run() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Board.deleteMany({}),
    BoardMember.deleteMany({}),
    List.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  const demoPassword = await bcrypt.hash("demo1234", 10);

  const [owner, member] = await User.create([
    {
      name: "Demo Owner",
      email: "owner@demo.com",
      passwordHash: demoPassword,
    },
    {
      name: "Demo Member",
      email: "member@demo.com",
      passwordHash: demoPassword,
    },
  ]);

  const board = await Board.create({
    title: "Interview Board",
    description: "Seeded board for demo",
    ownerId: owner._id,
  });

  await BoardMember.create([
    {
      boardId: board._id,
      userId: owner._id,
      role: "owner",
    },
    {
      boardId: board._id,
      userId: member._id,
      role: "member",
    },
  ]);

  const [todo, inProgress, done] = await List.create([
    { boardId: board._id, title: "To Do", position: 1000 },
    { boardId: board._id, title: "In Progress", position: 2000 },
    { boardId: board._id, title: "Done", position: 3000 },
  ]);

  await Task.create([
    {
      boardId: board._id,
      listId: todo._id,
      title: "Read assignment",
      description: "Understand deliverables",
      assigneeIds: [owner._id],
      position: 1000,
    },
    {
      boardId: board._id,
      listId: inProgress._id,
      title: "Build backend APIs",
      description: "Auth, boards, lists, tasks, activities",
      assigneeIds: [owner._id, member._id],
      position: 1000,
    },
    {
      boardId: board._id,
      listId: done._id,
      title: "Setup project skeleton",
      description: "Client + server directories",
      assigneeIds: [member._id],
      position: 1000,
    },
  ]);

  // eslint-disable-next-line no-console
  console.log("Seed complete");
  // eslint-disable-next-line no-console
  console.log("Demo credentials:");
  // eslint-disable-next-line no-console
  console.log("owner@demo.com / demo1234");
  // eslint-disable-next-line no-console
  console.log("member@demo.com / demo1234");

  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
