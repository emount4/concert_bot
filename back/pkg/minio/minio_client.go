package minio

import (
	"context"

	minioSDK "github.com/minio/minio-go/v7"
)

type Client interface {
	// Задание: минимальный интерфейс для DI.
	//
	// Идея: handlers/services зависят от интерфейса, а не от env/config.
	Ready(ctx context.Context) error
	Bucket() string
	SDK() *minioSDK.Client
}

type client struct {
	mc     *minioSDK.Client
	bucket string
}

func (c *client) Bucket() string {
	return c.bucket
}

func (c *client) SDK() *minioSDK.Client {
	return c.mc
}

func (c *client) Ready(ctx context.Context) error {
	// Простая проверка доступности: запрос списка бакетов.
	// Это сетевой вызов, поэтому его лучше дергать только в /ready или мониторинге.
	_, err := c.mc.ListBuckets(ctx)
	return err
}
