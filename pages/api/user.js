import prisma from '../../lib/prisma';

export default async function handler(req, res) {
    const users = await prisma.user.findMany({
        include: {
            posts: {
                select: { id: true, title: true, content: true },
                where: { published: true }
            },
        },
    });
    res.status(200).json({
        props: { users },
        revalidate: 10,
    });
}
  