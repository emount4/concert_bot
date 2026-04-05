package minio

import (
	"errors"
	"fmt"
	"strings"

	minioSDK "github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Config struct {
	Endpoint  string
	Bucket    string
	AccessKey string
	SecretKey string
	UseSSL    bool
}

func New(cfg Config) (Client, error) {
	// Задание: сборка MinIO клиента из конфигурации (dependency injection).
	if err := cfg.validate(); err != nil {
		return nil, err
	}

	mc, err := minioSDK.New(cfg.Endpoint, &minioSDK.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio new client: %w", err)
	}

	return &client{mc: mc, bucket: cfg.Bucket}, nil
}

func (c Config) validate() error {
	var err error
	if strings.TrimSpace(c.Endpoint) == "" {
		err = errors.Join(err, errors.New("minio endpoint is required"))
	}
	if strings.TrimSpace(c.Bucket) == "" {
		err = errors.Join(err, errors.New("minio bucket is required"))
	}
	if strings.TrimSpace(c.AccessKey) == "" {
		err = errors.Join(err, errors.New("minio access key is required"))
	}
	if strings.TrimSpace(c.SecretKey) == "" {
		err = errors.Join(err, errors.New("minio secret key is required"))
	}
	if err != nil {
		return fmt.Errorf("invalid minio config: %w", err)
	}
	return nil
}
